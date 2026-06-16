import type { Metadata } from "next";
import { DashboardShell } from "@/components/recora/dashboard-shell";

export const metadata: Metadata = {
  title: "Recora ダッシュボード",
  description: "RecoraのAI検索分析ダッシュボード。"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
