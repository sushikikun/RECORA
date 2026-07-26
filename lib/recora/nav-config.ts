import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleGauge,
  Database,
  FileText,
  Gauge,
  Home,
  Lightbulb,
  Link2,
  MessageSquareText,
  Radar,
  Settings,
  Swords,
  UsersRound
} from "lucide-react";

export type RecoraNavStatus = "ready" | "preparing";

export type RecoraNavSection =
  | "顧客レポート";

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

const sectionOrder: RecoraNavSection[] = ["顧客レポート"];

export type RecoraNavBuildOptions = {
  showReportContextItems?: boolean;
  showRecommendations?: boolean;
};

export function buildRecoraNavItems(reportId?: string, options: RecoraNavBuildOptions = {}): RecoraNavItem[] {
  const reportBase = reportId ? `/dashboard/reports/${reportId}` : undefined;
  const dashboardHref = reportId === "design-check" ? "/dashboard?design-check=1" : "/dashboard";
  const showRecommendations = options.showRecommendations ?? true;

  const reportDetailItems: RecoraNavItem[] = reportBase
    ? [
        {
          label: "ダッシュボード概要",
          href: reportBase,
          section: "顧客レポート",
          status: "ready",
          icon: Radar
        },
        {
          label: "ブランド・競合",
          href: `${reportBase}/leaderboard`,
          section: "顧客レポート",
          status: "ready",
          icon: Swords
        },
        {
          label: "ペルソナ・トピック",
          href: `${reportBase}/persona-topics`,
          section: "顧客レポート",
          status: "ready",
          icon: UsersRound
        },
        {
          label: "プロンプト",
          href: `${reportBase}/prompts`,
          section: "顧客レポート",
          status: "ready",
          icon: FileText
        },
        {
          label: "AI回答",
          href: `${reportBase}/conversations`,
          section: "顧客レポート",
          status: "ready",
          icon: MessageSquareText
        },
        {
          label: "引用・参照元",
          href: `${reportBase}/sources`,
          section: "顧客レポート",
          status: "ready",
          icon: Link2
        },
        {
          label: "ブランド認識・感情",
          href: `${reportBase}/brand-perception`,
          section: "顧客レポート",
          status: "ready",
          icon: CircleGauge
        },
        {
          label: "推移・変化",
          href: `${reportBase}/trends`,
          section: "顧客レポート",
          status: "ready",
          icon: BarChart3
        },
        ...(showRecommendations ? [{
          label: "改善提案・施策" as const,
          href: `${reportBase}/recommendations`,
          section: "顧客レポート" as const,
          status: "ready" as const,
          icon: Lightbulb
        }] : []),
        {
          label: "設定・連携",
          href: `${reportBase}/settings`,
          section: "顧客レポート",
          status: "ready",
          icon: Settings
        }
      ]
    : [];

  return [
    {
      label: "ダッシュボード概要",
      href: dashboardHref,
      section: "顧客レポート",
      status: "ready",
      icon: Gauge,
      description: "AI検索での見え方を、グラフと数値で確認します。"
    },
    {
      label: "レポート一覧",
      href: "/dashboard/reports",
      section: "顧客レポート",
      status: "ready",
      icon: Home,
      description: "レポート一覧を確認します。"
    },
    ...reportDetailItems
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
  overview: ["ダッシュボード概要"],
  conversations: ["AI回答"],
  trends: ["推移・変化"],
  prompts: ["プロンプト"],
  leaderboard: ["ブランド・競合"],
  sources: ["引用・参照元"],
  brandPerception: ["ブランド認識・感情"],
  recommendations: ["改善提案・施策"],
  contentOpportunities: ["コンテンツ改善候補", "ページ改善候補", "改善マップ", "コンテンツ不足"],
  technicalAudit: ["サイト技術診断", "FAQ・構造化データ提案"],
  actionPlan: ["改善プラン", "30/60/90日プラン", "タスク管理"]
} as const;

export const placeholderRouteSummaries = {
  reportHistory: {
    title: "レポート履歴",
    description: "過去に作成したAI検索レポートを、期間・プロジェクト・公開可否で確認する画面です。"
  },
  runResults: {
    title: "実行履歴",
    description: "測定runの開始・終了時刻、除外された観測を実行単位で確認する画面です。"
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
    title: "設定",
    description: "顧客向けレポートでは使用しない管理項目です。"
  },
  apiIntegrations: {
    title: "設定",
    description: "顧客向けレポートでは使用しない管理項目です。"
  }
} as const;
