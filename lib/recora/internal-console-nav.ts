import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  Gauge,
  Send,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  WalletCards
} from "lucide-react";

import type { RecoraInternalAdminAccess, RecoraInternalRole } from "@/lib/recora/internal-admin-access";

export type RecoraInternalNavStatus = "ready" | "planned";

export type RecoraInternalNavItem = {
  label: string;
  shortLabel: string;
  href: string;
  description: string;
  icon: LucideIcon;
  status: RecoraInternalNavStatus;
  requiredRole: RecoraInternalRole;
  aliases?: string[];
};

const internalNavItems: RecoraInternalNavItem[] = [
  {
    label: "運用ホーム",
    shortLabel: "運用ホーム",
    href: "/internal",
    description: "全体の稼働状況と、今対応が必要な例外を確認します。",
    icon: Gauge,
    status: "ready",
    requiredRole: "viewer"
  },
  {
    label: "顧客管理",
    shortLabel: "顧客",
    href: "/internal/customers",
    description: "顧客、Project、顧客ユーザー、問い合わせを確認します。",
    icon: Building2,
    status: "ready",
    requiredRole: "viewer",
    aliases: ["/internal/customer-ops", "/internal/projects"]
  },
  {
    label: "測定管理",
    shortLabel: "測定",
    href: "/internal/measurements",
    description: "日次測定、run、失敗、再試行、安全停止を確認します。",
    icon: Activity,
    status: "ready",
    requiredRole: "operator",
    aliases: ["/internal/operations"]
  },
  {
    label: "品質・例外レビュー",
    shortLabel: "品質",
    href: "/internal/quality",
    description: "自動品質判定で例外になった対象だけを確認します。",
    icon: ShieldCheck,
    status: "ready",
    requiredRole: "reviewer"
  },
  {
    label: "公開管理",
    shortLabel: "公開",
    href: "/internal/publication",
    description: "公開候補、公開版、現在の公開先、配信確認を確認します。",
    icon: Send,
    status: "ready",
    requiredRole: "reviewer"
  },
  {
    label: "障害・監査",
    shortLabel: "障害・監査",
    href: "/internal/incidents",
    description: "障害、復旧、システム状態、重要操作の監査履歴を確認します。",
    icon: Siren,
    status: "ready",
    requiredRole: "operator"
  },
  {
    label: "利用量・コスト",
    shortLabel: "利用量・コスト",
    href: "/internal/usage-cost",
    description: "AI利用量、内部変動原価、未算定、CSV出力を確認します。",
    icon: WalletCards,
    status: "ready",
    requiredRole: "viewer"
  },
  {
    label: "管理設定",
    shortLabel: "管理設定",
    href: "/internal/settings",
    description: "管理者、通知、日次処理、AIモデル、プラン、ルールを管理します。",
    icon: SlidersHorizontal,
    status: "ready",
    requiredRole: "admin",
    aliases: ["/internal/plans"]
  }
];

export function buildRecoraInternalNavItems(access: Pick<RecoraInternalAdminAccess, "roles">) {
  const roles = new Set(access.roles);

  return internalNavItems.filter((item) => item.status === "ready" && roles.has(item.requiredRole));
}

export function getRecoraInternalNavItem(pathname: string) {
  return internalNavItems.find((item) => {
    if (item.href === "/internal") return pathname === item.href;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;

    return item.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`)) ?? false;
  }) ?? null;
}
