import type { Metadata } from "next";
import { DashboardShell } from "@/components/recora/dashboard-shell";

export const metadata: Metadata = {
  title: "Recora Dashboard",
  description: "Recora AI visibility and brand monitoring dashboard."
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
