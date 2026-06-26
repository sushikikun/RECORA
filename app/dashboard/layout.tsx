import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardShell } from "@/components/recora/dashboard-shell";
import { isRecoraDesignPreviewEnabled } from "@/lib/recora/dev-preview/design-preview-access";

export const metadata: Metadata = {
  title: "Recora ダッシュボード",
  description: "RecoraのAI検索分析ダッシュボード。"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F9FA] text-[#0F172A]">{children}</div>}>
      <DashboardShell designPreviewEnabled={isRecoraDesignPreviewEnabled()}>{children}</DashboardShell>
    </Suspense>
  );
}
