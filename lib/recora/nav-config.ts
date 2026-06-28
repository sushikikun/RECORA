import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CircleGauge,
  Database,
  FolderKanban,
  Gauge,
  Home,
  Layers3,
  Lightbulb,
  LineChart,
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
  | "プロジェクト管理"
  | "ワークスペース"
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
  "プロジェクト管理",
  "ワークスペース"
];

export type RecoraNavBuildOptions = {
  showReportContextItems?: boolean;
  showCustomerWorkspaceItems?: boolean;
};

export function buildRecoraNavItems(reportId?: string, options: RecoraNavBuildOptions = {}): RecoraNavItem[] {
  const reportBase = reportId ? `/dashboard/reports/${reportId}` : undefined;
  const dashboardHref = reportId === "design-check" ? "/dashboard?design-check=1" : "/dashboard";
  const showCustomerWorkspaceItems = options.showCustomerWorkspaceItems ?? false;

  const reportDetailItems: RecoraNavItem[] = reportBase
    ? [
        {
          label: "概要",
          href: reportBase,
          section: "レポート",
          status: "ready",
          icon: Radar
        },
        {
          label: "推移",
          href: `${reportBase}/trends`,
          section: "レポート",
          status: "ready",
          icon: LineChart
        },
        {
          label: "ブランド比較",
          href: `${reportBase}/leaderboard`,
          section: "レポート",
          status: "ready",
          icon: Swords
        },
        {
          label: "質問別分析",
          href: `${reportBase}/prompts`,
          section: "レポート",
          status: "ready",
          icon: Layers3
        },
        {
          label: "AI回答",
          href: `${reportBase}/conversations`,
          section: "レポート",
          status: "ready",
          icon: MessageSquareText
        },
        {
          label: "参照元",
          href: `${reportBase}/sources`,
          section: "レポート",
          status: "ready",
          icon: Database
        },
        {
          label: "ブランド認知",
          href: `${reportBase}/brand-perception`,
          section: "レポート",
          status: "ready",
          icon: CircleGauge
        },
        {
          label: "改善候補",
          href: `${reportBase}/recommendations`,
          section: "レポート",
          status: "ready",
          icon: Lightbulb
        }
      ]
    : [];

  const workspaceItems: RecoraNavItem[] = showCustomerWorkspaceItems
    ? [
        {
          label: "プロジェクト管理",
          href: "/dashboard/config/project",
          section: "プロジェクト管理",
          status: "ready",
          icon: BriefcaseBusiness,
          description: "プロジェクトの基本情報を確認します。"
        },
        {
          label: "プロジェクト一覧",
          href: "/dashboard/config/project",
          section: "ワークスペース",
          status: "ready",
          icon: FolderKanban,
          description: "ワークスペース内のプロジェクトを確認します。"
        },
        {
          label: "メンバー管理",
          href: "/dashboard/config/team",
          section: "ワークスペース",
          status: "ready",
          icon: Users,
          description: "メンバーと権限を確認します。"
        },
        {
          label: "設定",
          href: "/dashboard/config/settings",
          section: "ワークスペース",
          status: "ready",
          icon: Settings,
          description: "ワークスペース設定を確認します。"
        }
      ]
    : [];

  return [
    {
      label: "ホーム",
      href: dashboardHref,
      section: "ホーム",
      status: "ready",
      icon: Gauge,
      description: "レポート横断の数字、推移、全体傾向を確認します。"
    },
    {
      label: "レポート",
      href: "/dashboard/reports",
      section: "レポート",
      status: "ready",
      icon: Home,
      description: "レポート一覧を確認します。"
    },
    ...reportDetailItems,
    ...workspaceItems
  ];
}

export function buildRecoraNavGroups(reportId?: string, options: RecoraNavBuildOptions = {}): RecoraNavGroup[] {
  const items = buildRecoraNavItems(reportId, options);

  return sectionOrder
    .map((section) => ({
      label: section,
      items: items.filter((item) => item.section === section)
    }))
    .filter((group) => group.items.length > 0);
}

export const reportDetailTabs = {
  overview: ["概要"],
  conversations: ["AI回答"],
  prompts: ["質問別分析"],
  leaderboard: ["ブランド比較"],
  sources: ["参照元"],
  brandPerception: ["ブランド認知"],
  recommendations: ["改善候補"],
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
    title: "質問別分析",
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
