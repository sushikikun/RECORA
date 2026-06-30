import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, ClipboardList, Gauge, WalletCards } from "lucide-react";

import type { RecoraInternalAdminAccess, RecoraInternalRole } from "@/lib/recora/internal-admin-access";

export type RecoraInternalNavStatus = "ready" | "planned";

export type RecoraInternalNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  status: RecoraInternalNavStatus;
  requiredRole: RecoraInternalRole;
};

const internalNavItems: RecoraInternalNavItem[] = [
  {
    label: "運用概要",
    href: "/internal",
    description: "内部運用コンソールの入口と現在の状態を確認します。",
    icon: Gauge,
    status: "ready",
    requiredRole: "viewer"
  },
  {
    label: "案件",
    href: "/internal/projects",
    description: "案件ごとのread model、run history、report-ready状態を確認します。",
    icon: BriefcaseBusiness,
    status: "ready",
    requiredRole: "viewer"
  },
  {
    label: "料金プラン",
    href: "/internal/plans",
    description: "現在の料金プラン定義をread-onlyで確認します。",
    icon: WalletCards,
    status: "ready",
    requiredRole: "viewer"
  },
  {
    label: "実行管理",
    href: "/internal/operations",
    description: "既存measurement runを使った実行計画の入口です。",
    icon: ClipboardList,
    status: "ready",
    requiredRole: "operator"
  }
];

export function buildRecoraInternalNavItems(access: Pick<RecoraInternalAdminAccess, "roles">) {
  const roles = new Set(access.roles);

  return internalNavItems.filter((item) => item.status === "ready" && roles.has(item.requiredRole));
}
