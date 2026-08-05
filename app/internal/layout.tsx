import type { Metadata } from "next";

import { InternalConsoleShell } from "@/components/recora/internal-console-shell";
import { requireInternalAccess } from "@/lib/recora/internal-admin-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recora 管理画面",
  description: "Recoraの運用・顧客・測定・品質・公開・障害・原価・設定を管理するローカル限定画面。"
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const access = requireInternalAccess();

  return <InternalConsoleShell access={access}>{children}</InternalConsoleShell>;
}
